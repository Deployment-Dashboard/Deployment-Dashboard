package cz.oksystem.deployment_dashboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Entity
@Table(name = "versions")
public class Version {

  @Id
  @GeneratedValue
  @Column(name = "ver_id")
  private Long id;

  @NotEmpty
  @Column(name = "name")
  private String name;

  @Column(name = "desc")
  private String description;

  @NotEmpty
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "app_id")
  private App app;

  @OneToMany(fetch = FetchType.LAZY, mappedBy = "ver", cascade = CascadeType.ALL)
  private List<Release> releases;
}
